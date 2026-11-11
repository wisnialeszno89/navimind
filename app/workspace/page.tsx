import { notFound } from "next/navigation";
import WorkspaceChat from "../components/WorkspaceChat";
import { isPrivateWorkspace } from "../lib/workspace";

export const dynamic = "force-dynamic";

export default function WorkspacePage() {
  if (!isPrivateWorkspace()) notFound();
  return <WorkspaceChat />;
}
