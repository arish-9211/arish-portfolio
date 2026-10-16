import mongoose from 'mongoose';
import {createHash} from 'node:crypto';

const Counter = mongoose.models.RateLimit || mongoose.model('RateLimit', new mongoose.Schema({
  _id: String,
  totalHits: Number,
  resetTime: {type: Date, index: {expires: 0}},
}));

// A shared fixed-window counter survives cold starts and scales across instances.
export class MongoRateLimitStore {
  localKeys = false;

  constructor(prefix) {
    this.prefix = prefix;
  }

  init({windowMs}) {
    this.windowMs = windowMs;
  }

  static async prepare() {
    await Counter.init();
  }

  bucket(key) {
    const end = (Math.floor(Date.now() / this.windowMs) + 1) * this.windowMs;
    const digest = createHash('sha256').update(key).digest('hex');
    return {id: `${this.prefix}:${digest}:${end}`, resetTime: new Date(end)};
  }

  async increment(key) {
    const {id, resetTime} = this.bucket(key);
    const update = {$inc: {totalHits: 1}, $setOnInsert: {resetTime}};
    let row;
    try {
      row = await Counter.findOneAndUpdate({_id: id}, update, {upsert: true, new: true}).lean();
    } catch (error) {
      if (error.code !== 11000) throw error;
      // Another instance may have created the same first counter concurrently.
      row = await Counter.findOneAndUpdate({_id: id}, {$inc: {totalHits: 1}}, {new: true}).lean();
    }
    return {totalHits: row.totalHits, resetTime: row.resetTime};
  }

  async decrement(key) {
    await Counter.updateOne({_id: this.bucket(key).id, totalHits: {$gt: 0}}, {$inc: {totalHits: -1}});
  }

  async resetKey(key) {
    await Counter.deleteOne({_id: this.bucket(key).id});
  }
}
