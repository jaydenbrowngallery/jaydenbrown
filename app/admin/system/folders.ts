import fs from "node:fs";

/* 사진 원본·작업 폴더 지도.
   개수는 페이지를 열 때마다 실제 폴더를 읽어서 표시한다(수치가 낡지 않게).
   맥미니에서 렌더링되므로 Pegasus가 마운트돼 있어야 읽힌다. */

export type FolderDef = {
  name: string;
  path: string;
  role: string; // 무엇에 쓰는 폴더인지
  rule?: string; // 언제 채워지고 언제 비워지는지
};

const PEGASUS = "/Volumes/Promise Pegasus";
const MAIN = `${PEGASUS}/맥미니메인`;

export const FOLDER_DEFS: FolderDef[] = [
  {
    name: "구글동기화 원본",
    path: `${MAIN}/구글동기화 원본`,
    role: "촬영 직후 원본이 들어오는 곳. 셀렉 프로젝트의 원본이 여기를 가리킨다.",
    rule: "45일이 지나면 '원본백업'으로 자동 이동된다.",
  },
  {
    name: "원본백업",
    path: `${MAIN}/원본백업`,
    role: "45일이 지난 촬영 원본의 보관처. 출고된 건은 폴더명 앞에 [출고완료]가 붙는다.",
    rule: "추출할 때 원본 링크가 끊겨 있으면 여기서 자동으로 찾아 다시 연결한다.",
  },
  {
    name: "촬영원본",
    path: `${MAIN}/촬영원본`,
    role: "선별·최종본 등 별도로 남겨두는 원본 작업 폴더.",
  },
  {
    name: "구글동기화 작업본",
    path: `${MAIN}/구글동기화 작업본`,
    role: "보정이 끝난 작업본. 고객 전달본과 PNP 발주 폴더가 이 안에 있다.",
  },
  {
    name: "작업할 사진",
    path: `${PEGASUS}/작업할 사진`,
    role: "고객이 고른 사진을 추출한 결과. '<날짜 이름> 셀렉' 폴더로 쌓인다.",
    rule: "여기 있는 건이 곧 후반작업 대기 목록이다. 끝나면 '완료'로 옮긴다.",
  },
  {
    name: "PNP주문 / 제이든브라운",
    path: `${MAIN}/구글동기화 작업본/PNP주문/제이든브라운`,
    role: "업체와 공유하는 발주 폴더. 앨범·액자 하위 폴더와 택배 주문서가 들어간다.",
    rule: "발주 완료 파일 정리가 자동화되어 있지 않아 예전 출고분이 남을 수 있다.",
  },
  {
    name: "구글 드라이브 (고객 전달)",
    path: "/Users/jaydenmini/Google Drive/내 드라이브",
    role: "고객에게 원본 다운로드 링크로 전달되는 폴더. 문자의 다운로드 링크가 여기를 가리킨다.",
    rule: "문자 안내상 1개월 후 삭제된다.",
  },
];

export type FolderStat = FolderDef & {
  dirs: number | null; // null = 읽기 실패(볼륨 미마운트 등)
  files: number;
  latest?: string; // 가장 최근에 생긴 하위 폴더명
};

export function readFolderStats(): FolderStat[] {
  return FOLDER_DEFS.map((d) => {
    try {
      const entries = fs
        .readdirSync(d.path, { withFileTypes: true })
        .filter((e) => !e.name.startsWith(".") && !e.name.startsWith("Icon"));
      const dirs = entries.filter((e) => e.isDirectory());
      let latest: string | undefined;
      let latestMs = 0;
      for (const e of dirs) {
        try {
          const st = fs.statSync(`${d.path}/${e.name}`);
          if (st.mtimeMs > latestMs) {
            latestMs = st.mtimeMs;
            latest = e.name.normalize("NFC");
          }
        } catch {}
      }
      return {
        ...d,
        dirs: dirs.length,
        files: entries.length - dirs.length,
        latest,
      };
    } catch {
      return { ...d, dirs: null, files: 0 };
    }
  });
}
