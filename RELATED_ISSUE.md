# @vue-pivottable/multi-value-renderer

## 작업 컨텍스트

이 패키지는 GitHub Issue #16 요청에 따라 개발되었습니다.

**관련 이슈**: https://github.com/Seungwoo321/vue-pivottable/issues/16
**요청 내용**: Multiple aggregators per column - 하나의 피벗 테이블에서 여러 값에 각각 다른 집계 함수를 적용하는 기능

## 현재 상태

- [x] 패키지 개발 완료
- [x] Vue 2/3 지원
- [x] 빌드 테스트 완료
- [ ] GitHub 레포 생성 (`vue-pivottable/multi-value-renderer`)
- [ ] npm 배포 (`@vue-pivottable/multi-value-renderer`)
- [ ] 이슈 코멘트 추가
- [ ] 이슈 닫기

## 다음 작업 지침

### 1. GitHub 레포 생성
- Organization: `vue-pivottable`
- Repository name: `multi-value-renderer`
- 이 디렉토리의 내용을 푸시

### 2. npm 배포
```bash
cd /Users/mzc01-swlee/dev/repository/github/projects-v1/multi-value-renderer
npm publish --access public
```

### 3. 이슈 코멘트 작성
이슈 URL: https://github.com/Seungwoo321/vue-pivottable/issues/16

코멘트 내용:
```markdown
이 기능은 별도 렌더러 패키지로 구현되었습니다.

### 설치
```bash
npm install @vue-pivottable/multi-value-renderer
```

### 사용법 (Vue 2)
```js
import { MultiValueRenderers } from '@vue-pivottable/multi-value-renderer/vue2'

// aggregatorMap으로 각 값별 다른 aggregator 지정
const aggregatorMap = {
  sales: 'Sum',
  quantity: 'Average'
}
```

### 사용법 (Vue 3)
```js
import { MultiValueRenderers } from '@vue-pivottable/multi-value-renderer'
```

자세한 내용은 [README](https://github.com/vue-pivottable/multi-value-renderer)를 참고하세요.
```

### 4. 이슈 닫기
코멘트 추가 후 이슈를 닫거나 enhancement 라벨 유지
