import StringHelperFunction from './preassessDena'

it('joins string elements in an array', () => {
  const stringHelper = new StringHelperFunction();
  expect(stringHelper.joinStrings(['阿部', 'ひろし'])).toEqual('阿部ひろし');
});

it('reverses string', () => {
  const stringHelper = new StringHelperFunction();
  expect(stringHelper.reverseString('テルマエ・ロマエ'))
    .toEqual('エマロ・エマルテ');
});

it('interleaps', () => {
  const stringHelper = new StringHelperFunction();
  expect(stringHelper.interLeap([ "地上波", "ダメ！", "絶対！" ]))
    .toEqual('地ダ絶上メ対波！！');
});

it('interleaps', () => {
  const stringHelper = new StringHelperFunction();
  expect(stringHelper.interLeap([ "地上波", "ダメだよ？", "絶対に！" ]))
    .toEqual('地ダ絶上メ対波だによ！？');
});

