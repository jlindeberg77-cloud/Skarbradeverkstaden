import test from 'node:test';
import assert from 'node:assert/strict';
import { example, derive } from '../src/model.mjs';
import { renderPreview } from '../src/preview.mjs';
test('inlay is escaped and all views render finite geometry',()=>{
  const p=example('chevron');p.inlay.enabled=true;p.inlay.text='<script>alert("x")</script>';
  const m=derive(p);
  for(const view of ['finish','section','source','cut','assembly']) {
    const {svg}=renderPreview(p,m,view);
    assert.ok(svg.startsWith('<svg'));assert.ok(!svg.includes('NaN'));assert.ok(!svg.includes('Infinity'));
    assert.ok(!svg.includes('<script>'));
  }
  assert.ok(renderPreview(p,m).svg.includes('&lt;script&gt;'));
});
test('invalid groove never renders a negative or overflowing path',()=>{
  const p=example();p.groove.enabled=true;p.groove.inset=180;
  assert.ok(!renderPreview(p,derive(p)).svg.includes('data-decoration="groove"'));
  p.groove.inset=18;
  assert.ok(renderPreview(p,derive(p)).svg.includes('data-decoration="groove"'));
});
