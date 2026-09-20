import { env, pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';
import { cosine, interestText, rankScore } from '../social/matching';
import type { Member } from '../social/types';

env.allowLocalModels = false;
// A single CPU thread works without cross-origin isolation. No server inference.
if (env.backends.onnx.wasm) env.backends.onnx.wasm.numThreads = 1;
const loadExtractor = pipeline as unknown as (task: 'feature-extraction', model: string, options: { dtype: 'q8'; device: 'wasm' }) => Promise<FeatureExtractionPipeline>;
let extractor: Promise<FeatureExtractionPipeline> | undefined;
self.onmessage = async (event: MessageEvent<{ me: Member; people: Member[]; signature: string }>) => {
  try {
    const { me, people, signature } = event.data;
    self.postMessage({ status: 'loading', signature });
    extractor ??= loadExtractor('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8', device: 'wasm' });
    const model = await extractor;
    const inputs = [me, ...people.slice(0, 50)];
    const vectors: number[][] = [];
    for (let i = 0; i < inputs.length; i++) {
      const tensor = await model(interestText(inputs[i]), { pooling: 'mean', normalize: true });
      vectors.push(tensor.tolist()[0] as number[]);
      self.postMessage({ status: 'ranking', done: i + 1, total: inputs.length, signature });
    }
    const ids = people.slice(0,50).map((person,i) => ({ id: person.id, score: rankScore(me,person,cosine(vectors[0],vectors[i+1])) })).sort((a,b) => b.score-a.score).map(p => p.id);
    self.postMessage({ status: 'ready', ids, signature });
  } catch {
    extractor = undefined;
    self.postMessage({ status: 'error', signature: event.data.signature });
  }
};
