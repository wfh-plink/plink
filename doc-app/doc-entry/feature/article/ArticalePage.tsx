import React, { useState, useEffect, useCallback, useRef } from 'react';
// import ReactDom from 'react-dom';
import classnames from 'classnames/bind';
import styles from './ArticalePage.module.scss';
import {TopAppBar} from '@wfh/doc-ui-common/client/material/TopAppBar';
import {Drawer} from '@wfh/doc-ui-common/client/material/Drawer';
import {useParams} from 'react-router-dom';
import {MarkdownIndex} from '@wfh/doc-ui-common/client/markdown/MarkdownIndex';
import {MarkdownViewComp, MarkdownViewCompProps} from '@wfh/doc-ui-common/client/markdown/MarkdownViewComp';
import {renderByMdKey} from './articaleComponents';
import {DocListComponents} from './DocListComponents';

const cx = classnames.bind(styles);
const logoCls = cx('logo');
const titleCls = cx('title');
const articaleCls = cx('articale-page');
const contentCls = cx('main-content');
const EMPTY_ARR: any[] = [];
export type ArticalePageProps = React.PropsWithChildren<{
}>;

const ArticalePage: React.FC<ArticalePageProps> = function(props) {
  const routeParams = useParams<{mdKey: string}>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [portals, setPortals] = useState(EMPTY_ARR);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);

  const onContentLoaded = useCallback<NonNullable<MarkdownViewCompProps['onContent']>>((div) => {
    const renderers = renderByMdKey[routeParams.mdKey];
    if (!renderers) return;

    const els: any[] = [];
    for (const [id, render] of Object.entries(renderers)) {
        div.querySelectorAll('.comp-' + id).forEach(found => {
          try {
            if (found) {
              const dataKey = found.getAttribute('data-key');
              if (dataKey)
                els.push(render(id, found, dataKey));
            }
          } catch (e) {
            console.error(e);
          }
        });
    }
    setPortals(els);
  }, EMPTY_ARR);

  const onDrawerToggle = useCallback(() => {
    setDrawerOpen(!drawerOpen);
  }, [drawerOpen]);

  const title = (
    <div className={titleCls}>
      <div className={logoCls}></div>
      用户技术业务前端架构简介
    </div>
  );

  return (
    <div className={articaleCls}>
      <Drawer title='文档' open={drawerOpen} content={<DocListComponents currentKey={routeParams.mdKey} />}>
        <TopAppBar title={title} type='short' onDrawerMenuClick={onDrawerToggle} />
        <main className={contentCls} ref={scrollRef}>
          <div className='mdc-top-app-bar--fixed-adjust'>
            <MarkdownIndex mdKey={routeParams.mdKey} scrollRef={scrollRef} />
            <MarkdownViewComp mdKey={routeParams.mdKey} onContent={onContentLoaded}/>
            {portals}
          </div>
        </main>
      </Drawer>
    </div>
  );
};

export {ArticalePage};
