"use client";
import { Upload, FileText, Image, FileSpreadsheet, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
const files = [
    {
        id: 1,
        name: "Product A - A+ Content Final.pdf",
        client: "John Doe",
        type: "pdf",
        size: "2.4 MB",
        version: "v2.0",
        date: "Jan 19, 2026"
    },
    {
        id: 2,
        name: "PPC Campaign Report - Week 3.xlsx",
        client: "John Doe",
        type: "excel",
        size: "856 KB",
        version: "v1.0",
        date: "Jan 18, 2026"
    },
    {
        id: 3,
        name: "Product Images - Main.zip",
        client: "Emily Smith",
        type: "image",
        size: "15.2 MB",
        version: "v2.0",
        date: "Jan 15, 2026"
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
const AdminFiles = () => {
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-2">Files</h1>
          <p className="text-muted-foreground">Upload and manage deliverables for clients.</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2"/>
          Upload File
        </Button>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed rounded-xl p-8 text-center bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer">
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4"/>
        <p className="font-medium mb-1">Drag and drop files here</p>
        <p className="text-sm text-muted-foreground">or click to browse</p>
      </div>

      {/* Files Grid */}
      <div>
        <h2 className="font-heading font-semibold mb-4">Recent Uploads</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (<div key={file.id} className="bg-card rounded-xl border p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{file.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">For: {file.client}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{file.version}</Badge>
                    <span className="text-xs text-muted-foreground">{file.size}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <p className="text-xs text-muted-foreground">{file.date}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4"/>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4"/>
                  </Button>
                </div>
              </div>
            </div>))}
        </div>
      </div>
    </div>);
};
export default AdminFiles;
