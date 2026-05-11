# Random Mix 카테고리 — Design

## Goal

홈 화면에 "랜덤 30" 주제 카테고리를 추가해, 모든 주제(내 단어장 포함)에서 무작위로 뽑은 30단어로 학습할 수 있게 한다. 카테고리에 진입할 때마다 새 30단어가 뽑힌다.

## Approach

`VOCAB`에 가상 카테고리 `random`을 추가하고, `selectCategory('random')` 진입 시점에 다른 모든 카테고리의 단어를 합쳐 섞은 뒤 앞 30개를 `VOCAB.random.words`에 대입한다. 이후 모든 게임 모드는 기존 코드(`VOCAB[state.currentCategory].words`)를 그대로 사용한다.

대안(카테고리 객체 밖에서 별도 분기를 두는 방식)은 `renderHome`, `renderModeSelect`, 각 게임 모드까지 모두 손대야 해서 채택하지 않는다.

## Changes

### 1. 데이터 (`js/game.js`)

`VOCAB` 객체에 항목 추가. 순서는 `custom` 바로 앞에 둔다(기본 13개 주제 → Random Mix → My Words):

```js
random: {
  name: 'Random Mix', nameKr: '랜덤 30',
  emoji: '🎲', color: '#845EC2',
  isRandom: true,
  words: []
}
```

### 2. 단어 풀 생성

`selectCategory(key)` 안에서 `key === 'random'`일 때 다음 로직을 실행한 뒤 기존 흐름 진행:

- `Object.keys(VOCAB)`에서 `random`을 제외한 모든 카테고리의 `words`를 평탄화
- `shuffle()`로 섞고 앞 30개를 `VOCAB.random.words`에 대입
- 풀이 30개 미만이면 풀 전체를 사용(현재 기본 단어만 390개라 실질적으로 발생 안 함)

```js
function selectCategory(key) {
  if (key === 'random') {
    const pool = Object.keys(VOCAB)
      .filter(k => k !== 'random')
      .flatMap(k => VOCAB[k].words);
    VOCAB.random.words = shuffle(pool).slice(0, 30);
  }
  state.currentCategory = key;
  state.screen = VOCAB[key]?.isCustom ? 'customManage' : 'modeSelect';
  playSound('category');
  render();
}
```

### 3. 홈 화면 카드 (`renderHome`)

카테고리 그리드 렌더링은 그대로 두되, 랜덤 카드는 진도 대신 안내 텍스트를 보여준다.

`isRandom = !!cat.isRandom`을 계산하고:

- `progressText`: 기존 분기에 random일 때 `'매번 새로운 30단어!'` 추가
- `cat-progress` 바: random일 때 렌더 생략 (또는 폭 0으로 두지 말고 전체 div를 안 그림 — 진도가 의미 없으므로)
- 카드 배경은 기존 비-custom 카드와 동일하게 `cat.color`로 그라데이션

총진도 합계(`totalWords`, `totalMastered`)에는 random을 포함하지 않는다 — 매번 다른 30개라 중복 집계가 됨.

### 4. 마스터 추적

random 카테고리에서는 `state.mastered.random`을 기록하지 않는다. 마스터를 기록하는 위치(스펠링/퀴즈 완료 등에서 `state.mastered[state.currentCategory]`를 업데이트하는 부분)에 `if (cat.isRandom) skip`을 추가한다.

### 5. modeSelect 화면 (`renderModeSelect`)

기존 코드가 그대로 동작한다. 단, random일 때는 "N개 단어 · M개 마스터" 부분을 "30개 단어 (매번 새로 뽑힘)"으로 대체한다.

## Out of Scope

- 30개 외 단어 수 선택 (요청 없음)
- 난이도 가중치 (요청 없음)
- 랜덤 모음에 전용 업적 (요청 없음)

## Verification

- 홈 화면에 Random Mix 카드가 보인다.
- 카드 진입 후 modeSelect → 단어 목록 / 카드 / 뜻 맞추기 / 단어 맞추기 / 짝 맞추기 / 스펠링 모두 정상 동작.
- 홈으로 돌아갔다가 다시 진입하면 30단어 세트가 바뀐다.
- 홈 상단 "전체 진도" 카운트가 Random 카테고리로 인해 부풀지 않는다.
- 빈 `custom`(0단어)으로도 정상 동작.
