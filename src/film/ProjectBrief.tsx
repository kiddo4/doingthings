import { useEffect, useRef, useState, type FormEvent } from 'react';
const EMAIL = 'smith@doingthings.xyz';
export default function ProjectBrief({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [ready, setReady] = useState(false);
  const [href, setHref] = useState('');
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current?.close();
  }, [open]);
  const prepare = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const body = `Hi doingthings,\n\nI'm ${values.get('name')}.\n\nHere's the story I want to bring to life:\n${values.get('idea')}\n\nI'm interested in: ${values.get('service')}\n\nYou can reach me at ${values.get('email')}.`;
    setHref(`mailto:${EMAIL}?subject=${encodeURIComponent(`Our next story — ${values.get('name')}`)}&body=${encodeURIComponent(body)}`);
    setReady(true);
  };
  return <dialog ref={dialog} className="project-dialog" aria-labelledby="brief-title" onClose={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <button className="dialog-close" onClick={onClose} aria-label="Close project brief">×</button>
    <span className="whisper">the next scene begins here.</span>
    <h2 id="brief-title">What’s your<br /><em>next story?</em></h2>
    <form onSubmit={prepare} hidden={ready}>
      <div className="form-row"><label>Your name<input name="name" autoComplete="name" required maxLength={100} placeholder="What should we call you?" /></label><label>Your email<input name="email" type="email" autoComplete="email" required maxLength={200} placeholder="you@somewhere.com" /></label></div>
      <label>The idea<textarea name="idea" required minLength={5} maxLength={3000} rows={3} placeholder="A half-formed thought is a perfectly good start." /></label>
      <label>What could we help with?<select name="service"><option>Let’s discover it together</option><option>Technology</option><option>Music & sound</option><option>Beauty & brand</option><option>Art & motion</option><option>Product design & build</option></select></label>
      <button type="submit" className="brief-submit">write the first line <span aria-hidden="true">↗</span></button>
      <p className="form-note">We’ll prepare an email for you to review and send.</p>
    </form>
    {ready && <div className="brief-ready" role="status"><p>Your first hello is ready.</p><span>Open it in your email app. Make it yours. Send it when you’re ready.</span><a className="brief-submit" href={href}>open your email draft <span aria-hidden="true">↗</span></a><button className="underlined" onClick={() => setReady(false)}>edit the idea</button><a className="form-note" href={`mailto:${EMAIL}`}>Or write directly to {EMAIL}</a></div>}
  </dialog>;
}
