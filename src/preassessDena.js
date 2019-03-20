export default class StringHelperFunctions {

  joinStrings = arrayOfStrings => {
    return arrayOfStrings.join("")
  };

  reverseString = string => {
    return string.split("").reverse().join("")
  };

  // Input: [ "地上波", "ダメだよ？", "絶対に！" ]
  // Output: "地ダ絶上メ対波だによ！？"
  interLeap = inputArrayOfStrings => {

    const pairsOfCharAndIndex = inputArrayOfStrings.map((e, indexOfInputArray) => {
      const charsOfWord = e.split("");
      return charsOfWord.map((char, indexOfChar) => {
        const charIndexOfResult = indexOfChar * inputArrayOfStrings.length + indexOfInputArray;
        return { charIndexOfResult , char }
      });
    }).reduce((acc, pre) => {
     return acc.concat([...pre])
    }, []);

    const longestWordLength = Math.max(...inputArrayOfStrings.map(e => e.length));
    const possibleMaximumLengthOfResult = longestWordLength * inputArrayOfStrings.length;

    return Array(possibleMaximumLengthOfResult).fill(0).map((e, index) => {
      const pairOfCharAndIndex = pairsOfCharAndIndex.filter(pair => pair.charIndexOfResult === index)[0];
      return pairOfCharAndIndex !== undefined ? pairOfCharAndIndex.char : ''
    }).join("")

  }

}