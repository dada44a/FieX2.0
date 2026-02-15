// @ts-ignore
export const authMiddleware = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.split(" ")[1];
  if (token !== process.env.SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
};