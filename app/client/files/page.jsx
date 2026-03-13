"use client";
import { Download, FileText, Image, FileSpreadsheet, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
const files = [
    {
        id: 1,
        name: "Product A - A+ Content Final.pdf",
        type: "pdf",
        size: "2.4 MB",
        version: "v2.0",
        uploadedBy: "Sarah Mitchell",
        date: "Jan 19, 2026"
    },
    {
        id: 2,
        name: "PPC Campaign Report - Week 3.xlsx",
        type: "excel",
        size: "856 KB",
        version: "v1.0",
        uploadedBy: "Sarah Mitchell",
        date: "Jan 18, 2026"
    },
    {
        id: 3,
        name: "Product Images - Main.zip",
        type: "image",
        size: "15.2 MB",
        version: "v2.0",
        uploadedBy: "Design Team",
        date: "Jan 15, 2026"
    },
    {
        id: 4,
        name: "Competitor Analysis Report.pdf",
        type: "pdf",
        size: "1.8 MB",
        version: "v1.0",
        uploadedBy: "Sarah Mitchell",
        date: "Jan 14, 2026"
    },
    {
        id: 5,
        name: "Brand Guidelines.pdf",
        type: "pdf",
        size: "4.2 MB",
        version: "v1.0",
        uploadedBy: "Design Team",
        date: "Jan 10, 2026"
    },
];
const getFileIcon = (type) => {
    switch (type) {
        case "pdf":
            return <FileText className="h-8 w-8 text-red-500"/>;
        case "excel":
            return <FileSpreadsheet className="h-8 w-8 text-green-500"/>;
        case "image":
            return <Image className="h-8 w-8 text-blue-500"/>;
        default:
            return <FileText className="h-8 w-8 text-muted-foreground"/>;
    }
};
const ClientFiles = () => {
    return (<div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold mb-2">Files & Deliverables</h1>
        <p className="text-muted-foreground">Access all files and deliverables for your account.</p>
      </div>

      {/* Files Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (<div key={file.id} className="bg-card rounded-xl border p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {getFileIcon(file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{file.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{file.size}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">{file.version}</Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-3">
                Uploaded by {file.uploadedBy} • {file.date}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1"/>
                  Preview
                </Button>
                <Button variant="default" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-1"/>
                  Download
                </Button>
              </div>
            </div>
          </div>))}
      </div>

      {/* Read-only Notice */}
      <div className="bg-accent/50 rounded-lg p-4 text-center text-sm text-muted-foreground">
        <p>Files are uploaded by your account manager. Contact them if you need additional files.</p>
      </div>
    </div>);
};
export default ClientFiles;
