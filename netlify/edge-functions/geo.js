export default async (_, context) => {
  const response = await context.next();
  const page = await response.text();

  const regex = /{{geo}}/i;

  let welcomeText;

  if (context.geo.city) {
    if (context.geo.city === "Brooklyn" && context.geo.subdivision.code === "NY") {
      welcomeText = `from Brooklyn. <em>Kazi</em> built this website there!`
    } else {
      welcomeText = `all the way from ${context.geo.city}! You&#8217;re on <em>Kazi&#8217;s</em> website.`;
    }
  } else {
    welcomeText = `<em>Kazi&#8217;s</em> website.`
  }

  const updatedPage = page.replace(regex, welcomeText);

  response.headers.set('cache-control', 'max-age=0, public, must-revalidate')

  return new Response(updatedPage, response);
};
