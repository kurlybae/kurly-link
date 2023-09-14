import { Formik } from 'formik';
import { Fragment } from 'react';
import { LinkData } from '@/types';
import axios from 'axios';

type FormData = Omit<LinkData, 'requestName' | 'requestEmail'>;

const stringFields: (keyof Omit<FormData, 'appOnly'>)[] = [
  'webUrl',
  'iosUrl',
  'aosUrl',
];

const fieldTitles: Record<keyof FormData, string> = {
  webUrl: '웹 링크',
  iosUrl: 'IOS 링크',
  aosUrl: '안드로이드 링크',
  appOnly: '앱 전용',
};

function checkUrl(url: string, isRequired = false) {
  if (url) {
    if (/https?:\/\//.test(url)) {
      return;
    }
    return '포맷 확인 필요';
  } else if (isRequired) {
    return '필수입니다';
  }
}

export default function Setting() {
  return (
    <>
      <Formik<FormData>
        initialValues={{
          webUrl: '',
          iosUrl: '',
          aosUrl: '',
          appOnly: false,
        }}
        onSubmit={async (data) => {
          const result = await axios
            .post<{ key: string }>('/api/admin/links', data)
            .then((x) => x.data.key);
          alert('등록완료' + result);
        }}
        validate={({ webUrl, iosUrl, aosUrl }) => {
          const error: Partial<FormData> = {};
          // const checkWebUrl = checkUrl(webUrl, true);
          // if (checkWebUrl) {
          //   error.webUrl = checkWebUrl;
          // }
          return error;
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
          /* and other goodies */
        }) => (
          <form onSubmit={handleSubmit}>
            {stringFields.map((key) => (
              <Fragment key={key}>
                {fieldTitles[key]}
                <input
                  type="text"
                  name={key}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values[key]}
                />
                {errors[key] && touched[key] && errors[key]}
                <br />
              </Fragment>
            ))}

            {fieldTitles.appOnly}
            <input
              type="checkbox"
              name="appOnly"
              onChange={handleChange}
              onBlur={handleBlur}
              checked={values.appOnly}
            />
            <br />
            <button type="submit" disabled={isSubmitting}>
              Submit
            </button>
          </form>
        )}
      </Formik>
    </>
  );
}
