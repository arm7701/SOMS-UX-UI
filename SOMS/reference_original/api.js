export function createApi(fetcher = globalThis.fetch.bind(globalThis)) {
  let csrfToken = "";
  async function request(path, method = "GET", body) {
    const headers = { Accept: "application/json" };
    if (method !== "GET") {
      headers["Content-Type"] = "application/json";
      headers["X-CSRF-Token"] = csrfToken;
    }
    let response;
    try {
      response = await fetcher(`/api${path}`, {
        method,
        headers,
        credentials: "same-origin",
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new Error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองอีกครั้ง");
    }
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error(`เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (${response.status})`);
    }
    if (!response.ok) {
      const error = new Error(
        payload.error?.message || `เกิดข้อผิดพลาด (${response.status})`,
      );
      error.status = response.status;
      throw error;
    }
    if (payload.data?.csrfToken) csrfToken = payload.data.csrfToken;
    return payload.data;
  }
  return {
    get: (path) => request(path),
    post: (path, body = {}) => request(path, "POST", body),
    put: (path, body) => request(path, "PUT", body),
    delete: (path) => request(path, "DELETE", {}),
  };
}
export const api = createApi();
