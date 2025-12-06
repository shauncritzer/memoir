import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Resources from "./pages/Resources";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogEditor from "./pages/BlogEditor";
import Products from "./pages/Products";
import AdminSeed from "./pages/AdminSeed";
import Product from "./pages/Product";
import ProductSuccess from "./pages/ProductSuccess";
import Coach from "./pages/Coach";
import Members from "./pages/Members";
import Course from "./pages/Course";
import AICoach from "./pages/AICoach";
import Success from "./pages/Success";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/resources" component={Resources} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/products/success" component={ProductSuccess} />
      <Route path="/products/:slug" component={Product} />
      <Route path="/products" component={Products} />
      <Route path="/success" component={Success} />
      <Route path="/coach" component={Coach} />
      <Route path="/ai-coach" component={AICoach} />
      <Route path="/members" component={Members} />
      <Route path="/course/:productId" component={Course} />
      <Route path="/admin/blog-editor" component={BlogEditor} />
      <Route path="/admin/seed" component={AdminSeed} />
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
