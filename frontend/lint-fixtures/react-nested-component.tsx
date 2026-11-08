// path: features/heat/fixture.tsx
// expect: react/no-unstable-nested-components
export function List({ items }: { items: string[] }) {
  function Row({ item }: { item: string }) {
    return <li>{item}</li>
  }
  return <ul>{items.map((item) => <Row key={item} item={item} />)}</ul>
}
