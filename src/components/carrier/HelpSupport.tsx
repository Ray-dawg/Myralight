import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  HelpCircle,
} from "lucide-react";

export default function HelpSupport() {
  const supportCategories = [
    {
      title: "Getting Started",
      description: "New to the platform? Find guides and tutorials here",
      icon: HelpCircle,
    },
    {
      title: "Technical Support",
      description: "Having technical issues? Get help here",
      icon: FileText,
    },
    {
      title: "Account & Billing",
      description: "Questions about your account or billing",
      icon: Mail,
    },
  ];

  const contactMethods = [
    {
      method: "Live Chat",
      availability: "24/7",
      icon: MessageCircle,
      action: "Start Chat",
    },
    {
      method: "Phone Support",
      availability: "Mon-Fri, 9AM-6PM EST",
      icon: Phone,
      action: "Call Now",
    },
    {
      method: "Email Support",
      availability: "Response within 24h",
      icon: Mail,
      action: "Send Email",
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Help & Support</h1>
          <p className="text-gray-500 mt-1">How can we help you today?</p>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for help articles..."
              className="pl-10"
            />
          </div>
        </Card>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {supportCategories.map((category) => (
            <Card
              key={category.title}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <category.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{category.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {category.description}
                    </p>
                  </div>
                  <Button variant="ghost" className="w-full justify-start">
                    View Articles
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactMethods.map((method) => (
                <div
                  key={method.method}
                  className="flex flex-col items-start space-y-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <method.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{method.method}</h3>
                    <p className="text-sm text-gray-500">
                      {method.availability}
                    </p>
                  </div>
                  <Button variant="outline" className="w-full">
                    {method.action}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
