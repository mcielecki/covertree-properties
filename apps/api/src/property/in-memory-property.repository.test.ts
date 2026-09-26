import { InMemoryPropertyRepository } from './in-memory-property.repository.js';
import { describePropertyRepositoryContract } from './property.repository.contract.js';

describePropertyRepositoryContract('in-memory', () => {
  let now = new Date();
  const repo = new InMemoryPropertyRepository({ clock: () => now });
  return {
    repo,
    insertAt: async (data, createdAt) => {
      const previous = now;
      now = createdAt;
      try {
        return await repo.create(data);
      } finally {
        now = previous;
      }
    },
  };
});
