export function DevWrap({ children }: { children: React.ReactNode }) {
  if (import.meta.env.DEV) {
    return children;
  }
  return <div style={{ border: "2px solid red", padding: "10px" }}>Em desenvolvimento</div>;
}