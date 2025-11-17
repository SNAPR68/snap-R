"use client";

export const dynamic = "force-dynamic";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import PageShell from "@/components/layout/page-shell";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        // Initialize Supabase client at runtime
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (jobsError) throw jobsError;
        setJobs(jobsData || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch jobs");
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold mb-6">Recent Jobs</h1>

      {loading && <p className="text-gray-600">Loading jobs...</p>}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No jobs found.</p>
          <p className="text-sm text-gray-500">
            Upload photos to create your first job.
          </p>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="hover:shadow-lg transition cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-mono truncate">
                      {job.id.slice(0, 8)}...
                    </CardTitle>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(job.created_at).toLocaleDateString()}
                  </p>
                  {job.updated_at && (
                    <p className="text-sm text-gray-600">
                      Updated: {new Date(job.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}

