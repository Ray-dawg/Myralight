import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, Book, Code, Wrench } from "lucide-react";

export default function Documentation() {
  const sections = [
    {
      title: "Getting Started",
      icon: Book,
      articles: [
        { title: "Platform Overview", link: "#overview" },
        { title: "Quick Start Guide", link: "#quickstart" },
        { title: "Basic Navigation", link: "#navigation" },
      ],
    },
    {
      title: "Fleet Management",
      icon: FileText,
      articles: [
        { title: "Vehicle Tracking", link: "#tracking" },
        { title: "Maintenance Scheduling", link: "#maintenance" },
        { title: "Performance Monitoring", link: "#performance" },
      ],
    },
    {
      title: "Technical Resources",
      icon: Code,
      articles: [
        { title: "API Documentation", link: "#api" },
        { title: "Integration Guides", link: "#integration" },
        { title: "Data Security", link: "#security" },
      ],
    },
    {
      title: "Troubleshooting",
      icon: Wrench,
      articles: [
        { title: "Common Issues", link: "#issues" },
        { title: "FAQs", link: "#faqs" },
        { title: "System Requirements", link: "#requirements" },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Documentation</h1>
          <p className="text-gray-500 mt-1">
            Everything you need to know about the platform
          </p>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search documentation..." className="pl-10" />
          </div>
        </Card>

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <Card
              key={section.title}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {section.articles.map((article) => (
                    <li key={article.title}>
                      <a
                        href={article.link}
                        className="text-gray-600 hover:text-primary hover:underline"
                      >
                        {article.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
