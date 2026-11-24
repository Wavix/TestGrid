import { Html, Head, Main, NextScript } from "next/document"
import Script from "next/script"

const APPLY_SAVED_THEME = `(function(){try{var t=localStorage.getItem("tg-theme");document.documentElement.dataset.tgTheme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.tgTheme="dark"}})()`

const Document = () => {
  return (
    <Html lang="en">
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="Description" content="TestGrid" />
      <Script crossOrigin="anonymous" src="https://polyfill.io/v3/polyfill.min.js" />
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;1,100;1,300;1,400;1,500;1,700&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: APPLY_SAVED_THEME }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

export default Document
