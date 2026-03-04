import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ScrollToTop } from "./components/ScrollToTop";
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
import RewiredMethod from "./pages/RewiredMethod";
import AdminVideos from "./pages/AdminVideos";
import AdminMigrate from "./pages/AdminMigrate";
import SeedDatabase from "./pages/SeedDatabase";
import AdminContent from "./pages/AdminContent";
import AdminDashboard from "./pages/AdminDashboard";
import ContentPipeline from "./pages/ContentPipeline";
import MissionControl from "./pages/MissionControl";
import StripeTest from "./pages/StripeTest";
import TermsOfUse from "./pages/TermsOfUse";
import RefundPolicy from "./pages/RefundPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import FAQs from "./pages/FAQs";
import RecoveryToolkit from "./pages/RecoveryToolkit";
import ReadingGuide from "./pages/ReadingGuide";
import First3Chapters from "./pages/First3Chapters";
import SevenDayReset from "./pages/SevenDayReset";
import FromBrokenToWhole from "./pages/FromBrokenToWhole";
import ThrivingSober from "./pages/ThrivingSober";
import Success from "./pages/Success";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import BookLaunch from "./pages/BookLaunch";
import { AdminRoute } from "./components/AdminRoute";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/memoir" component={Memoir} />
      <Route path="/book" component={BookLaunch} />
      <Route path="/resources" component={Resources} />
      <Route path="/recovery-toolkit" component={RecoveryToolkit} />
      <Route path="/reading-guide" component={ReadingGuide} />
      <Route path="/first-3-chapters" component={First3Chapters} />
      <Route path="/rewired-method" component={RewiredMethod} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      {/* Admin routes - require authenticated admin */}
      <Route path="/admin">{() => <AdminRoute component={AdminDashboard} />}</Route>
      <Route path="/admin/blog-editor">{() => <AdminRoute component={BlogEditor} />}</Route>
      <Route path="/admin/videos">{() => <AdminRoute component={AdminVideos} />}</Route>
      <Route path="/admin/seed">{() => <AdminRoute component={SeedDatabase} />}</Route>
      <Route path="/admin/content">{() => <AdminRoute component={AdminContent} />}</Route>
      <Route path="/admin/pipeline">{() => <AdminRoute component={ContentPipeline} />}</Route>
      <Route path="/admin/mission-control">{() => <AdminRoute component={MissionControl} />}</Route>
      <Route path="/admin/migrate">{() => <AdminRoute component={AdminMigrate} />}</Route>
      <Route path="/login" component={Login} />
      <Route path="/products" component={Products} />
      <Route path="/stripe-test" component={StripeTest} />
      <Route path="/ai-coach" component={AICoach} />
      <Route path="/7-day-reset" component={SevenDayReset} />
      <Route path="/from-broken-to-whole" component={FromBrokenToWhole} />
      <Route path="/thriving-sober" component={ThrivingSober} />
      <Route path="/success" component={Success} />
      <Route path="/members" component={Members} />
      <Route path="/course/:productId" component={Course} />
      <Route path="/terms-of-use" component={TermsOfUse} />
      <Route path="/refund-policy" component={RefundPolicy} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/faqs" component={FAQs} />
      <Route path="/contact" component={Contact} />
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
          <ScrollToTop />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
