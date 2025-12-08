import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Memoir from "./pages/Memoir";
import Resources from "./pages/Resources";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogEditor from "./pages/BlogEditor";
import Products from "./pages/Products";
import Members from "./pages/Members";
import Course from "./pages/Course";
import AICoach from "./pages/AICoach";
import AdminVideos from "./pages/AdminVideos";
import SeedDatabase from "./pages/SeedDatabase";
import StripeTest from "./pages/StripeTest";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/memoir" component={Memoir} />
      <Route path="/resources" component={Resources} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/admin/blog-editor" component={BlogEditor} />
      <Route path="/admin/videos" component={AdminVideos} />
      <Route path="/admin/seed" component={SeedDatabase} />
      <Route path="/products" component={Products} />
      <Route path="/stripe-test" component={StripeTest} />
      <Route path="/ai-coach" component={AICoach} />
      <Route path="/members" component={Members} />
      <Route path="/course/:productId" component={Course} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
