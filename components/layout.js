import { useState } from "react";

import Footer from "./footer";
import Header from "./header";
import getCourseConfig from "../data/course";
import { Provider as HeaderProvider } from "../context/headerContext";
import { Provider as CourseInfoProvider } from "../context/courseInfoContext";

function Layout({ children }) {
  const courseInfo = getCourseConfig();
  const headerHook = useState({});
  return (
    <CourseInfoProvider value={courseInfo}>
      <HeaderProvider value={headerHook}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
        <div className="remix-app">
          <Header title={courseInfo.title} />
          <div className="content-container">
            <div className="main">{children}</div>
          </div>
          <Footer
            twitter={courseInfo.social.twitter}
            github={courseInfo.social.github}
            linkedin={courseInfo.social.linkedin}
            bluesky={courseInfo.social.bluesky}
          />
        </div>
        <script async defer src="https://a.holt.courses/latest.js"></script>
        <noscript>
          <img
            src="https://a.holt.courses/noscript.gif"
            alt=""
            referrerPolicy="no-referrer-when-downgrade"
          />
        </noscript>
      </HeaderProvider>
    </CourseInfoProvider>
  );
}

export default function App({ children }) {
  return <Layout>{children}</Layout>;
}
