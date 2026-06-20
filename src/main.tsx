import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./styles.css";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Topic from "./pages/Topic";
import Lesson from "./pages/Lesson";
import Upload from "./pages/Upload";
import NotFound from "./pages/NotFound";

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/t/:topicId", element: <Topic /> },
      { path: "/upload", element: <Upload /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  // lesson viewer is full-screen, outside the chrome layout
  { path: "/t/:topicId/:lessonId", element: <Lesson /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
