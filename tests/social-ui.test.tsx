import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

// DOM component tests: no browser rendering, screenshot, or network is involved.
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/demo' });
for (const name of ['self','window','document','HTMLElement','HTMLDialogElement','HTMLInputElement','HTMLTextAreaElement','Event','MouseEvent','MutationObserver','Node','Element','sessionStorage','FormData']) Object.defineProperty(globalThis, name, { value: (dom.window as unknown as Record<string, unknown>)[name], configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
Object.defineProperty(globalThis, 'location', { value: dom.window.location, configurable: true });
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
dom.window.scrollTo = () => {};
dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open',''); };
dom.window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
const { render, screen, within, cleanup, waitFor } = await import('@testing-library/react');
const { default: userEvent } = await import('@testing-library/user-event');
const { AppRouterContext } = await import('next/dist/shared/lib/app-router-context.shared-runtime.js');
const { default: SocialApp } = await import('../components/social/social-app');
const fakeRouter = { back() {}, forward() {}, refresh() {}, push() {}, replace() {}, prefetch: async () => {} };

test('React social experience supports complete demo journeys', async t => {
  sessionStorage.clear();
  const user = userEvent.setup({ document: dom.window.document });
  render(<AppRouterContext.Provider value={fakeRouter}><SocialApp demo/></AppRouterContext.Provider>);
  await screen.findByRole('heading', { name: 'Your campus, in good company.' });
  await screen.findByRole('button', { name: 'Create' });
  const mainNav = within(screen.getByRole('navigation', { name: 'Main navigation' }));

  await t.test('a composed post appears in the feed and can receive a reply', async () => {
    await user.click(screen.getByRole('button', { name: 'Create' }));
    const modal = within(screen.getByRole('dialog'));
    await user.type(modal.getByLabelText('Your moment'), 'A real question for my campus: who wants to start a tiny project?');
    await user.click(modal.getByRole('button', { name: 'Share moment' }));
    await waitFor(() => assert.equal(screen.queryByRole('dialog'), null));
    const post = screen.getByText('A real question for my campus: who wants to start a tiny project?').closest('article')!;
    await user.click(within(post).getByRole('button', { name: 'Like post' }));
    assert.equal(within(post).getByRole('button', { name: 'Unlike post' }).getAttribute('aria-pressed'), 'true');
    await user.click(within(post).getByRole('button', { name: 'Save post' }));
    await user.click(within(post).getByRole('button', { name: 'Open comments' }));
    await user.type(screen.getByLabelText('Your reply'), 'Starting this Friday. Everyone is welcome.');
    await user.click(screen.getByRole('button', { name: 'Send reply' }));
    await screen.findByText('Starting this Friday. Everyone is welcome.');
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
  });
  await t.test('saved view and search expose the item the user just saved', async () => {
    await user.click(mainNav.getByRole('button', { name: 'Saved for later' }));
    await screen.findByRole('heading', { name: 'For another moment.' });
    await user.type(screen.getByRole('textbox', { name: 'Search current view' }), 'tiny project');
    assert.equal(screen.getAllByRole('article').length, 1);
    assert.ok(screen.getByText(/A real question for my campus/));
  });
  await t.test('circle membership unlocks its conversation', async () => {
    await user.click(mainNav.getByRole('button', { name: 'Circles' }));
    await user.click(screen.getByRole('button', { name: 'Open One More Chapter' }));
    assert.ok(screen.getByText('Join this circle to add to the conversation.'));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Join circle' }));
    await screen.findByLabelText('Your reply');
    await user.type(screen.getByLabelText('Your reply'), 'What are you reading this week?');
    await user.click(screen.getByRole('button', { name: 'Send reply' }));
    await screen.findByText('What are you reading this week?');
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
  });
  await t.test('joining a plan updates My plans', async () => {
    await user.click(mainNav.getByRole('button', { name: 'Make plans' }));
    await user.click(screen.getByRole('button', { name: 'Open Golden hour, good company' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Join plan' }));
    assert.ok(within(screen.getByRole('dialog')).getByRole('button', { name: 'Going' }));
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    await user.click(screen.getByRole('button', { name: 'My plans' }));
    await screen.findByRole('heading', { name: 'Golden hour, good company' });
  });
  await t.test('a connection request can be accepted and an actual message sent', async () => {
    await user.click(mainNav.getByRole('button', { name: /Messages/ }));
    await user.click(screen.getByRole('button', { name: 'Accept' }));
    await user.click(screen.getByRole('button', { name: /Diya Joshi You’re connected/ }));
    const message = screen.getByRole('textbox', { name: 'Message Diya Joshi' });
    await user.type(message, 'Hi Diya! What got you into photography?');
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => assert.equal(screen.getAllByText('Hi Diya! What got you into photography?').length, 1));
    assert.ok(screen.getByText('Demo conversation. Sample members don’t send live replies.'));
  });
  await t.test('profile edits persist across navigation and reload', async () => {
    await user.click(screen.getByRole('button', { name: 'Your profile and preferences' }));
    const input = screen.getByLabelText('Your name');
    await user.clear(input); await user.type(input, 'Sam Example');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    const stored = JSON.parse(sessionStorage.getItem('toveli_demo_v4')!);
    assert.equal(stored.me.name, 'Sam Example');
    cleanup();
    render(<AppRouterContext.Provider value={fakeRouter}><SocialApp demo/></AppRouterContext.Provider>);
    await waitFor(() => assert.match(screen.getByRole('button', { name: 'Your profile and preferences' }).textContent!, /Sam Example/));
  });
  await t.test('deleting an owned post requires confirmation and removes it', async () => {
    const article = screen.getByText(/A real question for my campus/).closest('article')!;
    const menu = within(article).getByLabelText(/Options for post by Sam Example/);
    await user.click(menu);
    await user.click(within(article).getByRole('button', { name: 'Delete' }));
    assert.ok(screen.getByText(/This removes the item and its conversation for everyone/));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove' }));
    await waitFor(() => assert.equal(screen.queryByText(/A real question for my campus/), null));
  });
  cleanup(); dom.window.close();
});
