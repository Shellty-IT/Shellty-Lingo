import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type {
  CourseLanguage,
  ExerciseContract,
  UserRole,
} from "@shellty/api-contracts";

import { AuthService } from "./auth.service";
import { ContentService } from "./content.service";
import { AccessGuard } from "./security.guards";

const token = (value?: string) => value?.replace(/^Bearer\s+/, "");

@Controller("content")
export class ContentController {
  constructor(
    private readonly content: ContentService,
    private readonly auth: AuthService,
  ) {}

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
  @UseGuards(AccessGuard)
  workspace(@Headers("authorization") authorization?: string) {
    this.require(token(authorization), "editor");
    return this.content.listWorkspace();
  }

  @Get("admin/conversation-reports")
  @UseGuards(AccessGuard)
  conversationReports(@Headers("authorization") authorization?: string) {
    this.require(token(authorization), "editor");
    return this.content.conversationReports();
  }

  @Post("admin/courses")
  @UseGuards(AccessGuard)
  course(
    @Body()
    body: {
      slug?: string;
      language?: string;
      level?: string;
      title?: string;
      description?: string;
    },
    @Headers("authorization") authorization?: string,
  ) {
    return this.content.createCourse(
      this.require(token(authorization), "editor").sub,
      body,
    );
  }

  @Post("admin/courses/:courseId/modules")
  @UseGuards(AccessGuard)
  module(
    @Param("courseId") courseId: string,
    @Body() body: { slug?: string; title?: string; position?: number },
    @Headers("authorization") authorization?: string,
  ) {
    return this.content.createModule(
      this.require(token(authorization), "editor").sub,
      courseId,
      body,
    );
  }

  @Post("admin/modules/:moduleId/lessons")
  @UseGuards(AccessGuard)
  createLesson(
    @Param("moduleId") moduleId: string,
    @Body() body: { slug?: string; position?: number },
    @Headers("authorization") authorization?: string,
  ) {
    return this.content.createLesson(
      this.require(token(authorization), "editor").sub,
      moduleId,
      body,
    );
  }

  @Post("admin/lessons/:lessonId/revisions")
  @UseGuards(AccessGuard)
  revision(
    @Param("lessonId") lessonId: string,
    @Body()
    body: {
      title?: string;
      summary?: string;
      estimatedMinutes?: number;
      exercises?: ExerciseContract[];
    },
    @Headers("authorization") authorization?: string,
  ) {
    return this.content.createRevision(
      this.require(token(authorization), "editor").sub,
      lessonId,
      body,
    );
  }

  @Post("admin/revisions/:revisionId/translations")
  @UseGuards(AccessGuard)
  translation(
    @Param("revisionId") revisionId: string,
    @Body()
    body: {
      locale?: string;
      field?: string;
      value?: string;
      verified?: boolean;
    },
    @Headers("authorization") authorization?: string,
  ) {
    return this.content.upsertTranslation(
      this.require(token(authorization), "editor").sub,
      revisionId,
      body,
    );
  }

  @Post("admin/revisions/:revisionId/submit")
  @UseGuards(AccessGuard)
  submit(
    @Param("revisionId") revisionId: string,
    @Headers("authorization") authorization?: string,
  ) {
    return this.content.submitForReview(
      this.require(token(authorization), "editor").sub,
      revisionId,
    );
  }

  @Post("admin/revisions/:revisionId/review")
  @UseGuards(AccessGuard)
  review(
    @Param("revisionId") revisionId: string,
    @Body() body: { approved?: boolean; note?: string },
    @Headers("authorization") authorization?: string,
  ) {
    return this.content.review(
      this.require(token(authorization), "editor").sub,
      revisionId,
      body.approved === true,
      body.note,
    );
  }

  @Post("admin/revisions/:revisionId/publish")
  @UseGuards(AccessGuard)
  publish(
    @Param("revisionId") revisionId: string,
    @Headers("authorization") authorization?: string,
  ) {
    return this.content.publish(
      this.require(token(authorization), "admin").sub,
      revisionId,
    );
  }

  @Post("admin/lessons/:lessonId/rollback/:version")
  @UseGuards(AccessGuard)
  rollback(
    @Param("lessonId") lessonId: string,
    @Param("version") version: string,
    @Headers("authorization") authorization?: string,
  ) {
    return this.content.rollback(
      this.require(token(authorization), "admin").sub,
      lessonId,
      Number(version),
    );
  }

  private require(value: string | undefined, minimum: "editor" | "admin") {
    const session = this.auth.verifyAccess(value);
    const allowed: UserRole[] =
      minimum === "admin" ? ["admin"] : ["editor", "admin"];
    if (!allowed.includes(session.role))
      throw new ForbiddenException({
        code: "CONTENT_FORBIDDEN",
        message: "Insufficient content permissions.",
      });
    return session;
  }
}
