// src/app/page.tsx
import TradeHubApp from "../components/TradeHubApp";
import OrdersUI from "../components/OrdersUI";
import HomePage from "./Home/page";
import LoginPage from "./auth/Login/page";
import Register from "./auth/Register/page";


export default function Page() {
// return <TradeHubApp />;

 return <LoginPage/>

// return <Register/>

 //return <OrdersUI/>;

//return <HomePage/>;

}