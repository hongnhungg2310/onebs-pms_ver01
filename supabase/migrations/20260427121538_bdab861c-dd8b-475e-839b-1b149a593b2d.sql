CREATE TABLE public.project_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  actor_id UUID,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_activities_project ON public.project_activities(project_id, created_at DESC);

ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pa_select_auth" ON public.project_activities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pa_insert_self" ON public.project_activities
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

CREATE POLICY "pa_delete_mgr" ON public.project_activities
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));