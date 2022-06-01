import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Home } from "../pages/Home";
import { PowerBI } from "../pages/PowerBI";
import { TwinBuilder } from "../pages/TwinBuilder";
import { TwinViewer } from "../pages/TwinViewer";

const getPage = (pageName: string): JSX.Element => {
  switch (pageName?.toLocaleLowerCase()) {
    case "twinviewer":
      return <TwinViewer />;
    case "twinbuilder":
      return <TwinBuilder />;
    case "powerbi":
      return <PowerBI/>
    case "home":
    case "/":
    default:
      return <Home />
  }
}

function NavigationRouter(props: any) {
  const [Navigation] = useState(props.Navigation ?? []);
  return (
    <div className={`main px-3 py-3 transition-all duration-700`} >
      <Routes>
        <Route key="home" path="/" element={getPage("home")}></Route>
        {Navigation && Navigation.map((item: any, idx: number) => (<Route key={idx} path={item.href} element={getPage(item.name)} />))}
      </Routes>
    </div>
  );
}

export default NavigationRouter;
