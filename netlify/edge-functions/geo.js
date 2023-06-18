export default async (_, context) => {
  const response = await context.next();
  const page = await response.text();
  const regex = /{{geo}}/i;
  const city = context.geo.city || "unknown";
  const updatedPage = page.replace(regex, city);

  response.headers.set("cache-control", "max-age=0, public, must-revalidate");

  return new Response(updatedPage, response);
};
