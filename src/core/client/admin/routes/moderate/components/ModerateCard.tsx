import cn from "classnames";
import React, { StatelessComponent } from "react";

import { PropTypesOf } from "talk-framework/types";
import { Button, Card, Flex, Icon } from "talk-ui/components";

import MarkersContainer from "../containers/MarkersContainer";
import ApproveButton from "./ApproveButton";
import CommentContent from "./CommentContent";
import InReplyTo from "./InReplyTo";
import styles from "./ModerateCard.css";
import RejectButton from "./RejectButton";
import Timestamp from "./Timestamp";
import Username from "./Username";

interface Props {
  username: string;
  createdAt: string;
  body: string;
  inReplyTo: string | null;
  comment: PropTypesOf<typeof MarkersContainer>["comment"];
  status: "approved" | "rejected" | "undecided";
  viewContextHref: string;
  suspectWords: ReadonlyArray<string>;
  bannedWords: ReadonlyArray<string>;
}

const ModerateCard: StatelessComponent<Props> = ({
  username,
  createdAt,
  body,
  inReplyTo,
  comment,
  viewContextHref,
  status,
  suspectWords,
  bannedWords,
}) => (
  <Card>
    <Flex>
      <div className={styles.mainContainer}>
        <div className={styles.topBar}>
          <div>
            <Username className={styles.username}>{username}</Username>
            <Timestamp>{createdAt}</Timestamp>
          </div>
          {inReplyTo && (
            <div>
              <InReplyTo>{inReplyTo}</InReplyTo>
            </div>
          )}
        </div>
        <CommentContent
          suspectWords={suspectWords}
          bannedWords={bannedWords}
          className={styles.content}
        >
          {body}
        </CommentContent>
        <div className={styles.footer}>
          <Flex justifyContent="flex-end">
            <Button
              variant="underlined"
              color="primary"
              anchor
              href={viewContextHref}
              target="_blank"
            >
              View Context <Icon>arrow_forward</Icon>
            </Button>
          </Flex>
          <Flex itemGutter>
            <MarkersContainer comment={comment} />
          </Flex>
        </div>
      </div>
      <div className={styles.separator} />
      <Flex
        className={cn(styles.aside, {
          [styles.asideWithoutReplyTo]: !inReplyTo,
        })}
        alignItems="center"
        direction="column"
        itemGutter
      >
        <div className={styles.decision}>DECISION</div>
        <Flex itemGutter>
          <RejectButton
            invert={status === "rejected"}
            disabled={status === "rejected"}
          />
          <ApproveButton
            invert={status === "approved"}
            disabled={status === "approved"}
          />
        </Flex>
      </Flex>
    </Flex>
  </Card>
);

export default ModerateCard;
