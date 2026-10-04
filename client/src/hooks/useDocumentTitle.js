import { useEffect } from 'react';

const APP_NAME = 'KosFinder';

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : `${APP_NAME} - Temukan Tempat Tinggal yang Tepat`;
  }, [title]);
}
