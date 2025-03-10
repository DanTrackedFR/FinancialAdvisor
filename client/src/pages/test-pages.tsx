import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Zap, Cpu } from "lucide-react";

export default function TestPages() {
  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Testing Tools</h1>
        <p className="text-muted-foreground">
          These test pages help verify PDF.js and WebSocket functionality in the application.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDF.js Test
            </CardTitle>
            <CardDescription>
              Test PDF.js configuration and text extraction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This page tests if PDF.js is properly configured and can extract text from PDF files.
              You can check the configuration and upload a PDF to test text extraction.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <a href="/pdf-test.html" target="_blank">Open PDF Test</a>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              WebSocket Test
            </CardTitle>
            <CardDescription>
              Test WebSocket connectivity and messaging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This page tests WebSocket connection to the server.
              You can send messages and verify real-time communication.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <a href="/websocket-test.html" target="_blank">Open WebSocket Test</a>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Combined Test
            </CardTitle>
            <CardDescription>
              Test PDF.js and WebSocket together
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This page tests the integration of PDF.js and WebSockets.
              You can upload PDFs and see real-time updates via WebSockets.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <a href="/pdfjs-websocket-test.html" target="_blank">Open Combined Test</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8">
        <Button variant="outline" asChild>
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}