import chai from 'chai';
import BKTree from '../src/bktree';

const expect = chai.expect;

describe('BKtree', () => {
  describe('#simWords', () => {
    it('should return 3 simwords', () => {
      const words = [
        '浙大',
        '浙江大学',
        '浙江大学软件学院',
        '浙大软院',
        'felt',
        'oops',
        'pop',
        'oouch',
        'halt',
      ];
      const bktree = new BKTree(words.length);
      bktree.add(words);
      const simWords = bktree.simWords('浙大', 3);
      expect(simWords).to.be.a('array');
      expect(simWords).to.have.lengthOf(3);
      expect(simWords[0]).to.eq('浙大');
    });
  });
});
