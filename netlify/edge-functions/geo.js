export default async (_, context) => {
  const response = await context.next();
  const page = await response.text();
  const regex = /{{geo}}/i;
  const city = context.geo.city || "unknown";
  const updatedPage = page.replace(regex, city);

  response.headers.set("Cache-Control", "max-age=0, must-revalidate, public");

  return new Response(updatedPage, response);
};
