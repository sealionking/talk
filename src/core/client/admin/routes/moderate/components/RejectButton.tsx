import cn from "classnames";
import React, { StatelessComponent } from "react";

import { PropTypesOf } from "talk-framework/types";
import { BaseButton, Icon } from "talk-ui/components";

import styles from "./RejectButton.css";

interface Props extends PropTypesOf<typeof BaseButton> {
  invert?: boolean;
}

const RejectButton: StatelessComponent<Props> = ({
  invert,
  className,
  ...rest
}) => (
  <BaseButton
    {...rest}
    className={cn(className, styles.root, {
      [styles.invert]: invert,
    })}
  >
    <Icon
      size="lg"
      className={cn(styles.icon, {
        [styles.invert]: invert,
      })}
    >
      close
    </Icon>
  </BaseButton>
);

export default RejectButton;