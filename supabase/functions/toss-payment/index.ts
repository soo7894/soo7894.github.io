import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.9";

const allowedOrigins = new Set([
  "https://soo7894.github.io",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
]);

const catalog = new Map([
  [1, { name: "스노우피크 아메니티돔 M 세트", amount: 298000 }],
  [2, { name: "헬리녹스 체어원 탄 컬러 2개", amount: 126000 }],
  [3, { name: "크레모아 3페이스 미니 라이트", amount: 59000 }],
  [4, { name: "씨투써밋 컴포트 플러스 매트", amount: 145000 }],
  [5, { name: "코베아 구이바다 M 풀세트", amount: 74000 }],
  [6, { name: "네이처하이크 다운 침낭 800FP", amount: 92000 }],
]);

function corsHeaders(origin: string | null) {
  const safeOrigin = origin && allowedOrigins.has(origin) ? origin : "https://soo7894.github.io";
  return {
    "Access-Control-Allow-Origin": safeOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(origin: string | null, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function safeText(value: unknown, fallback: string) {
  return typeof value === "string" ? value.slice(0, 200) : fallback;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !allowedOrigins.has(origin)) return json(null, { error: "허용되지 않은 요청 출처입니다." }, 403);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json(origin, { error: "POST 요청만 지원합니다." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKeysRaw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  const tossSecretKey = Deno.env.get("TOSS_SECRET_KEY");
  if (!supabaseUrl || !publishableKeysRaw || !secretKeysRaw || !tossSecretKey) return json(origin, { error: "결제 서버 설정이 완료되지 않았습니다." }, 500);
  if (!tossSecretKey.startsWith("test_")) return json(origin, { error: "테스트 키가 아닌 결제 키는 사용할 수 없습니다." }, 503);

  const publishableKey = JSON.parse(publishableKeysRaw)?.default;
  const adminKey = JSON.parse(secretKeysRaw)?.default;
  const authorization = req.headers.get("Authorization");
  if (!publishableKey || !adminKey || !authorization?.startsWith("Bearer ")) return json(origin, { error: "로그인이 필요합니다." }, 401);

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json(origin, { error: "로그인 정보가 만료되었습니다. 다시 로그인해주세요." }, 401);
  const user = userData.user;

  const admin = createClient(supabaseUrl, adminKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(origin, { error: "요청 형식이 올바르지 않습니다." }, 400); }

  if (body.action === "prepare") {
    const gearId = Number(body.gearId);
    const gear = Number.isSafeInteger(gearId) ? catalog.get(gearId) : undefined;
    if (!gear) return json(origin, { error: "현재 테스트 결제를 지원하지 않는 장비입니다." }, 400);
    const orderId = `CL-${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
    const { error } = await admin.from("payment_orders").insert({
      order_id: orderId, user_id: user.id, gear_id: gearId, order_name: gear.name,
      amount: gear.amount, currency: "KRW", status: "READY",
    });
    if (error) return json(origin, { error: "테스트 주문을 만들지 못했습니다." }, 500);
    return json(origin, { orderId, orderName: gear.name, amount: gear.amount, currency: "KRW", testMode: true });
  }

  if (body.action !== "confirm") return json(origin, { error: "지원하지 않는 결제 요청입니다." }, 400);
  const paymentKey = typeof body.paymentKey === "string" ? body.paymentKey : "";
  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const amount = Number(body.amount);
  if (!paymentKey || paymentKey.length > 200 || !/^[A-Za-z0-9_-]{6,64}$/.test(orderId) || !Number.isSafeInteger(amount) || amount <= 0) {
    return json(origin, { error: "결제 승인 정보가 올바르지 않습니다." }, 400);
  }

  const { data: order, error: orderError } = await admin.from("payment_orders")
    .select("id, order_id, user_id, order_name, amount, currency, status, method, approved_at, created_at")
    .eq("order_id", orderId).eq("user_id", user.id).maybeSingle();
  if (orderError || !order) return json(origin, { error: "일치하는 테스트 주문을 찾을 수 없습니다." }, 404);
  if (order.status === "DONE") return json(origin, { status: "DONE", orderId: order.order_id, orderName: order.order_name, totalAmount: order.amount, method: order.method, approvedAt: order.approved_at, testMode: true });
  if (order.status !== "READY") return json(origin, { error: "이미 처리되었거나 다시 시작해야 하는 주문입니다." }, 409);

  if (order.amount !== amount) {
    await admin.from("payment_orders").update({ status: "FAILED", failure_code: "AMOUNT_MISMATCH", failure_message: "결제 요청 금액과 서버 주문 금액이 다릅니다.", updated_at: new Date().toISOString() }).eq("id", order.id);
    return json(origin, { error: "결제 금액이 일치하지 않습니다." }, 400);
  }
  if (Date.now() - new Date(order.created_at).getTime() > 10 * 60 * 1000) {
    await admin.from("payment_orders").update({ status: "FAILED", failure_code: "ORDER_EXPIRED", failure_message: "테스트 결제 승인 가능 시간이 지났습니다.", updated_at: new Date().toISOString() }).eq("id", order.id);
    return json(origin, { error: "결제 승인 시간이 지났습니다. 다시 시도해주세요." }, 408);
  }

  const { data: lockedOrder, error: lockError } = await admin.from("payment_orders")
    .update({ status: "IN_PROGRESS", payment_key: paymentKey, updated_at: new Date().toISOString() })
    .eq("id", order.id).eq("status", "READY").select("id").maybeSingle();
  if (lockError || !lockedOrder) return json(origin, { error: "이미 승인 중인 주문입니다." }, 409);

  let tossResponse: Response;
  let tossResult: Record<string, unknown>;
  try {
    tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${tossSecretKey}:`)}`, "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount }),
      signal: AbortSignal.timeout(15000),
    });
    tossResult = await tossResponse.json();
  } catch {
    await admin.from("payment_orders").update({ status: "READY", payment_key: null, updated_at: new Date().toISOString() }).eq("id", order.id);
    return json(origin, { error: "토스 결제 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요." }, 502);
  }

  if (!tossResponse.ok) {
    const failureCode = safeText(tossResult.code, "TOSS_CONFIRM_FAILED");
    const failureMessage = safeText(tossResult.message, "테스트 결제 승인에 실패했습니다.");
    await admin.from("payment_orders").update({ status: "FAILED", failure_code: failureCode, failure_message: failureMessage, updated_at: new Date().toISOString() }).eq("id", order.id);
    return json(origin, { error: failureMessage, code: failureCode }, tossResponse.status);
  }
  if (tossResult.orderId !== orderId || Number(tossResult.totalAmount) !== order.amount) {
    await admin.from("payment_orders").update({ status: "FAILED", failure_code: "TOSS_RESPONSE_MISMATCH", failure_message: "승인 응답의 주문 정보가 서버 주문과 다릅니다.", updated_at: new Date().toISOString() }).eq("id", order.id);
    return json(origin, { error: "결제 승인 결과를 검증하지 못했습니다." }, 502);
  }

  const method = safeText(tossResult.method, "CARD");
  const approvedAt = typeof tossResult.approvedAt === "string" ? tossResult.approvedAt : new Date().toISOString();
  const { error: saveError } = await admin.from("payment_orders").update({ status: "DONE", method, approved_at: approvedAt, failure_code: null, failure_message: null, updated_at: new Date().toISOString() }).eq("id", order.id);
  if (saveError) return json(origin, { error: "결제는 승인되었지만 주문 저장에 실패했습니다. 관리자에게 문의해주세요." }, 500);
  return json(origin, { status: "DONE", orderId, orderName: order.order_name, totalAmount: order.amount, method, approvedAt, testMode: true });
});
