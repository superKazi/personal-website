export default async (_, context) => {
  const response = await context.next();
  const page = await response.text();

  const regex = /{{geo}}/i;

  const welcomeText =
    context.geo.city === "Brooklyn" && context.geo.subdivision.code === "NY"
      ? `from Brooklyn. <em>Kazi</em> built this website there!`
      : `all the way from ${context.geo.city}! You&#8217;re on <em>Kazi&#8217;s</em> website.`;

  const updatedPage = page.replace(regex, welcomeText);

  response.headers.set('cache-control', 'max-age=0, no-store, must-revalidate')

  return new Response(updatedPage, response);
};
