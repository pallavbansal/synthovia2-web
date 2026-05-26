import Head from "next/head";

const PageHead = ({ title }) => {
  return (
    <>
      <Head>
        <title>{title ? `${title} | Synthovia – Write Less. Create More.` : "Synthovia – Write Less. Create More."}</title>
        <meta name="description" content="Stop staring at blank pages. Synthovia generates ads, captions, emails, SEO content & scripts in seconds — no prompts, no fluff. Try free today." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
    </>
  );
};

export default PageHead;
