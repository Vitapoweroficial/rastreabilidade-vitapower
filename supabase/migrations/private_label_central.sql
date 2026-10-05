CREATE TABLE public.pl_central_documents (
  kind text NOT NULL CHECK (kind IN ('project','settings','preferences')),
  id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(payload) = 'object'),
  revision integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(kind,id)
);
CREATE TABLE public.pl_central_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  actor_id bigint NOT NULL,
  actor_name text NOT NULL,
  summary text NOT NULL,
  previous_stage text,
  new_stage text,
  revision integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pl_central_events_project_date ON public.pl_central_events(project_id,created_at DESC);
ALTER TABLE public.pl_central_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pl_central_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pl_central_documents, public.pl_central_events FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE ON public.pl_central_documents TO service_role;
GRANT SELECT,INSERT ON public.pl_central_events TO service_role;
CREATE FUNCTION public.pl_central_save(p_kind text,p_id text,p_payload jsonb,p_revision integer,p_actor_id bigint,p_actor_name text,p_summary text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE oldrow public.pl_central_documents; newrow public.pl_central_documents; value jsonb; oldstage text; newstage text;
BEGIN
  IF p_actor_id <= 0 OR length(p_actor_name) = 0 OR length(p_summary) = 0 OR octet_length(p_payload::text) > 262144 THEN RAISE EXCEPTION 'Invalid payload'; END IF;
  INSERT INTO public.pl_central_documents(kind,id) VALUES(p_kind,p_id) ON CONFLICT DO NOTHING;
  SELECT * INTO oldrow FROM public.pl_central_documents WHERE kind=p_kind AND id=p_id FOR UPDATE;
  IF oldrow.revision <> p_revision THEN RAISE EXCEPTION 'REVISION_CONFLICT' USING ERRCODE='40001'; END IF;
  value := p_payload;
  IF p_kind = 'project' THEN
    oldstage := oldrow.payload->>'stage'; newstage := p_payload->>'stage';
    value := value || jsonb_build_object('updatedAt',now(),'createdAt',coalesce(oldrow.payload->'createdAt',to_jsonb(now())),
      'stageEnteredAt',CASE WHEN oldstage IS DISTINCT FROM newstage THEN to_jsonb(now()) ELSE coalesce(oldrow.payload->'stageEnteredAt',to_jsonb(now())) END);
  END IF;
  UPDATE public.pl_central_documents SET payload=value,revision=revision+1,updated_at=now() WHERE kind=p_kind AND id=p_id RETURNING * INTO newrow;
  IF p_kind = 'project' THEN
    INSERT INTO public.pl_central_events(project_id,actor_id,actor_name,summary,previous_stage,new_stage,revision)
    VALUES(p_id,p_actor_id,p_actor_name,p_summary,oldstage,newstage,newrow.revision);
  END IF;
  RETURN to_jsonb(newrow);
END $$;
REVOKE ALL ON FUNCTION public.pl_central_save(text,text,jsonb,integer,bigint,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pl_central_save(text,text,jsonb,integer,bigint,text,text) TO service_role;
