import React, { StatelessComponent } from "react";

import { Flex, HorizontalGutter } from "talk-ui/components";
import { PropTypesOf } from "talk-ui/types";

import AutoLoadMoreContainer from "../containers/AutoLoadMoreContainer";
import ModerateCardContainer from "../containers/ModerateCardContainer";
import styles from "./Queue.css";

interface Props {
  comments: Array<
    { id: string } & PropTypesOf<typeof ModerateCardContainer>["comment"]
  >;
  settings: PropTypesOf<typeof ModerateCardContainer>["settings"];
  onLoadMore: () => void;
  hasMore: boolean;
  disableLoadMore: boolean;
}

const Queue: StatelessComponent<Props> = ({
  settings,
  comments,
  hasMore,
  disableLoadMore,
  onLoadMore,
}) => (
  <HorizontalGutter className={styles.root} size="double">
    {comments.map(c => (
      <ModerateCardContainer key={c.id} settings={settings} comment={c} />
    ))}
    {hasMore && (
      <Flex justifyContent="center">
        <AutoLoadMoreContainer
          disableLoadMore={disableLoadMore}
          onLoadMore={onLoadMore}
        />
      </Flex>
    )}
  </HorizontalGutter>
);

export default Queue;
