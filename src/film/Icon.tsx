type IconName = 'arrow' | 'down' | 'replay' | 'play' | 'pause';

// Geometry keeps these controls identical across system fonts and emoji renderers.
export default function Icon({ name }: { name: IconName }) {
  return <svg className="film-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {name === 'arrow' && <path d="M5 19 19 5M5 5h14v14" />}
    {name === 'down' && <path d="M12 3v18m-7-7 7 7 7-7" />}
    {name === 'replay' && <path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" />}
    {name === 'play' && <path d="m7 4 13 8-13 8Z" />}
    {name === 'pause' && <path d="M8 4v16M16 4v16" />}
  </svg>;
}
