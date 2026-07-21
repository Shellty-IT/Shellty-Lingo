import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { CourseLanguage, ExerciseContract } from "@shellty/api-contracts";
import { ApiTags } from "@nestjs/swagger";

import type { TokenPayload } from "../auth/auth.service";
import { ContentService } from "./content.service";
import {
  AccessGuard,
  CurrentUser,
  RequireRole,
  RolesGuard,
} from "../auth/security.guards";

@ApiTags("content")
@Controller("content")
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get("courses")
  courses(@Query("language") language?: CourseLanguage) {
    return this.content.publishedCourses(language);
  }

  @Get("courses/:courseSlug/lessons/:lessonSlug")
  lesson(
    @Param("courseSlug") courseSlug: string,
    @Param("lessonSlug") lessonSlug: string,
  ) {
    return this.content.publishedLesson(courseSlug, lessonSlug);
  }

  @Get("admin/workspace")
  @UseGuards(AccessGuard, RolesGuard)
  @RequireRole("editor")
  workspace() {
    return this.content.listWorkspace();
  }

  @Get("admin/conversation-reports")
  @UseGuards(AccessGuard, RolesGuard)
  @RequireRole("editor")
  conversationReports() {
    return this.content.conversationReports();
  }

  @Post("admin/courses")
  @UseGuards(AccessGuard, RolesGuard)
  @RequireRole("editor")
  course(
    @Body()
    body: {
      slug?: string;
      language?: string;
      level?: string;
      title?: string;
      description?: string;
    },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.content.createCourse(user.sub, body);
  }

  @Post("admin/courses/:courseId/modules")
  @UseGuards(AccessGuard, RolesGuard)
  @RequireRole("editor")
  module(
    @Param("courseId") courseId: string,
    @Body() body: { slug?: string; title?: string; position?: number },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.content.createModule(user.sub, courseId, body);
  }

  @Post("admin/modules/:moduleId/lessons")
  @UseGuards(AccessGuard, RolesGuard)
  @RequireRole("editor")
  createLesson(
    @Param("moduleId") moduleId: string,
    @Body() body: { slug?: string; position?: number },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.content.createLesson(user.sub, moduleId, body);
  }

  @Post("admin/lessons/:lessonId/revisions")
  @UseGuards(AccessGuard, RolesGuard)
  @RequireRole("editor")
  revision(
    @Param("lessonId") lessonId: string,
    @Body()
    body: {
      title?: string;
      summary?: string;
      estimatedMinutes?: number;
      exercises?: ExerciseContract[];
    },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.content.createRevision(user.sub, lessonId, body);
  }

  @Post("admin/revisions/:revisionId/translations")
  @UseGuards(AccessGuard, RolesGuard)
  @RequireRole("editor")
  translation(
    @Param("revisionId") revisionId: string,
    @Body()
    body: {
      locale?: string;
      field?: string;
      value?: string;
      verified?: boolean;
    },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.content.upsertTranslation(user.sub, revisionId, body);
  }

  @Post("admin/revisions/:revisionId/submit")
  @UseGuards(AccessGuard, RolesGuard)
  @RequireRole("editor")
  submit(
    @Param("revisionId") revisionId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.content.submitForReview(user.sub, revisionId);
  }

  @Post("admin/revisions/:revisionId/review")
  @UseGuards(AccessGuard, RolesGuard)
  @RequireRole("editor")
  review(
    @Param("revisionId") revisionId: string,
    @Body() body: { approved?: boolean; note?: string },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.content.review(
      user.sub,
      revisionId,
      body.approved === true,
      body.note,
    );
  }

  @Post("admin/revisions/:revisionId/publish")
  @UseGuards(AccessGuard, RolesGuard)
  @RequireRole("admin")
  publish(
    @Param("revisionId") revisionId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.content.publish(user.sub, revisionId);
  }

  @Post("admin/lessons/:lessonId/rollback/:version")
  @UseGuards(AccessGuard, RolesGuard)
  @RequireRole("admin")
  rollback(
    @Param("lessonId") lessonId: string,
    @Param("version") version: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.content.rollback(user.sub, lessonId, Number(version));
  }
}
