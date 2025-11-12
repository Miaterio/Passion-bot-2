/* eslint-disable @next/next/no-img-element */
'use client';

import { useMemo } from 'react';
import {
  initData,
  type User,
  useSignal,
} from '@tma.js/sdk-react';
import { List, Placeholder } from '@telegram-apps/telegram-ui';

import {
  DisplayData,
  type DisplayDataRow,
} from '@/components/DisplayData/DisplayData';
import { Page } from '@/components/Page';

function getUserRows(user: User): DisplayDataRow[] {
  return Object.entries(user).map(([title, value]) => ({ title, value }));
}

export default function InitDataPage() {
  const initDataRaw = useSignal(initData.raw);
  const user = useSignal(initData.user);
  const receiver = useSignal(initData.receiver);
  const chat = useSignal(initData.chat);
  const authDate = useSignal(initData.authDate);
  const hash = useSignal(initData.hash);
  const queryId = useSignal(initData.queryId);
  const startParam = useSignal(initData.startParam);

  const initDataRows = useMemo<DisplayDataRow[] | undefined>(() => {
    if (!initDataRaw) {
      return;
    }
    const rows: DisplayDataRow[] = [{ title: 'raw', value: initDataRaw }];
    if (authDate) rows.push({ title: 'authDate', value: authDate.toISOString() });
    if (hash) rows.push({ title: 'hash', value: hash });
    if (queryId) rows.push({ title: 'queryId', value: queryId });
    if (startParam) rows.push({ title: 'startParam', value: startParam });
    return rows;
  }, [initDataRaw, authDate, hash, queryId, startParam]);

  const userRows = useMemo<DisplayDataRow[] | undefined>(() => {
    return user ? getUserRows(user) : undefined;
  }, [user]);

  const receiverRows = useMemo<DisplayDataRow[] | undefined>(() => {
    return receiver ? getUserRows(receiver) : undefined;
  }, [receiver]);

  const chatRows = useMemo<DisplayDataRow[] | undefined>(() => {
    return !chat
      ? undefined
      : Object.entries(chat).map(([title, value]) => ({
          title,
          value,
        }));
  }, [chat]);

  if (!initDataRows) {
    return (
      <Page>
        <Placeholder
          header="Oops"
          description="Application was launched with missing init data"
        >
          <img
            alt="Telegram sticker"
            src="https://xelene.me/telegram.gif"
            style={{ display: 'block', width: '144px', height: '144px' }}
          />
        </Placeholder>
      </Page>
    );
  }
  return (
    <Page>
      <List>
        <DisplayData header={'Init Data'} rows={initDataRows} />
        {userRows && <DisplayData header={'User'} rows={userRows} />}
        {receiverRows && (
          <DisplayData header={'Receiver'} rows={receiverRows} />
        )}
        {chatRows && <DisplayData header={'Chat'} rows={chatRows} />}
      </List>
    </Page>
  );
}
