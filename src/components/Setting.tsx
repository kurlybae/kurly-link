import { Formik } from 'formik';
import { Fragment } from 'react';
import { LinkData } from '@/types';
import axios from 'axios';

const stringFields: (keyof Omit<LinkData, 'appOnly'>)[] = [
  'webUrl',
  'iosUrl',
  'aosUrl',
];

const fieldTitles: Record<keyof LinkData, string> = {
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
      <Formik<LinkData>
        initialValues={{
          webUrl: '',
          iosUrl: '',
          aosUrl: '',
          appOnly: false,
        }}
        onSubmit={async (data) => {
          await axios('/api/admin/links', {
            method: 'post',
            data,
          });
        }}
        validate={({ webUrl, iosUrl, aosUrl }) => {
          const error: Partial<LinkData> = {};
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
