import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Implement actual form submission
    // For now, just show a success message
    setTimeout(() => {
      toast.success("Message sent!", {
        description: "We'll get back to you as soon as possible.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navigation */}
      <Navigation />

      {/* Content */}
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-yellow-500 mb-4">Get In Touch</h1>
            <p className="text-gray-400 text-lg">
              Have a question or want to connect? We'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="bg-gradient-to-br from-gray-900 to-black border-yellow-600/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-500">
                  <MessageSquare className="h-5 w-5" />
                  Send Us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                      Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="bg-black/50 border-yellow-600/30 text-white"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="bg-black/50 border-yellow-600/30 text-white"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="bg-black/50 border-yellow-600/30 text-white"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="bg-black/50 border-yellow-600/30 text-white min-h-[150px]"
                      placeholder="Tell us what's on your mind..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-yellow-900/20 to-black border-yellow-600/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-500 mb-2">Email</h3>
                      <p className="text-gray-300 text-sm mb-2">
                        For general inquiries, support, or questions about our programs:
                      </p>
                      <a
                        href="mailto:contact@shauncritzer.com"
                        className="text-yellow-500 hover:text-yellow-400 transition-colors"
                      >
                        contact@shauncritzer.com
                      </a>
                      <p className="text-gray-400 text-xs mt-2">
                        We typically respond within 24-48 hours
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-900 to-black border-yellow-600/30">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-yellow-500 mb-3">What We Can Help With</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• Questions about our courses and programs</li>
                    <li>• Technical support and account issues</li>
                    <li>• Partnership and collaboration inquiries</li>
                    <li>• Media and speaking requests</li>
                    <li>• General recovery support questions</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-900/20 to-black border-red-600/30">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-red-500 mb-3">Crisis Support</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    If you're in crisis or need immediate support, please reach out to these resources:
                  </p>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>
                      <strong>Crisis Hotline:</strong> <a href="tel:988" className="text-red-400 hover:text-red-300">988</a>
                    </li>
                    <li>
                      <strong>SAMHSA:</strong> <a href="tel:1-800-662-4357" className="text-red-400 hover:text-red-300">1-800-662-4357</a>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
