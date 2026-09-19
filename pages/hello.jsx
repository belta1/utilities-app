// Module form: export a component. Query-string params arrive as props.
// GET /hello?name=Ada
export default function Hello({ name = "world" }) {
  return (
    <main>
      <h1>Hello, {name}!</h1>
      <p>Rendered by react-dom/server.</p>
    </main>
  );
}
